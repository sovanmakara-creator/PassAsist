import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
// @ts-ignore
import { EXAM_RESOURCES, HELPFUL_SOURCES } from "../src/services/exam-resources.ts";
// @ts-ignore
import { COURSES } from "../src/services/course-data.ts";

// Ensure environment variables exist
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

// Initialize Supabase Client with Service Role Key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function migrate() {
  console.log("Starting Supabase Migration...");

  // 1. Gather all resources from local TS files
  const resourcesToMigrate = [];

  // Add Helpful Sources
  for (const r of HELPFUL_SOURCES) {
    resourcesToMigrate.push({ ...r, category: "helpful" });
  }

  // Add Exam Resources (IELTS, TOEFL, TOEIC)
  for (const [examCode, sections] of Object.entries(EXAM_RESOURCES)) {
    for (const [sectionKey, resources] of Object.entries(sections as any)) {
      if (Array.isArray(resources)) {
        for (const r of resources) {
          resourcesToMigrate.push({ ...r, category: examCode }); // category = ielts, toefl, toeic
        }
      }
    }
  }

  console.log(`Found ${resourcesToMigrate.length} resources to migrate.`);

  // 2. Process each resource
  for (const r of resourcesToMigrate) {
    let finalUrl = r.url;

    // Check if it's a local PDF we need to upload
    if (r.url.startsWith("/resources/") && r.url.endsWith(".pdf")) {
      const localFilePath = path.join(process.cwd(), "public", r.url);

      if (fs.existsSync(localFilePath)) {
        console.log(`Uploading PDF for: ${r.title}...`);

        // Extract filename
        const filename = path.basename(r.url);

        // Read file
        const fileBuffer = fs.readFileSync(localFilePath);

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from("pdfs")
          .upload(`${r.category}/${filename}`, fileBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (storageError) {
          console.error(`  ✗ Failed to upload ${filename}: ${storageError.message}`);
        } else {
          // Store relative storage path in database for private bucket access
          finalUrl = `${r.category}/${filename}`;
          console.log(`  ✓ Uploaded and saved path: ${finalUrl}`);
        }
      } else {
        console.warn(`  ! File not found locally: ${localFilePath}`);
      }
    }

    // 3. Insert into `resources` table
    const resourceRecord = {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      difficulty: r.difficulty || null,
      url: finalUrl,
      type: r.type,
    };

    const { error: dbError } = await supabase.from("resources").upsert(resourceRecord);

    if (dbError) {
      console.error(`  ✗ Failed to insert resource ${r.id}: ${dbError.message}`);
    } else {
      console.log(`  ✓ Inserted resource: ${r.id}`);
    }

    // 4. Insert into `courses` table if it has a corresponding course
    // The previous implementation linked to `/courses/${courseId}` where courseId might be `r.id` or a custom ID.
    // Let's find the matching course in `course-data.ts`.
    let courseMatch = COURSES[r.id];

    // Handle the special 'ielts-mock-secrets' case
    if (r.id === "ielts-mock-secrets" || r.url.includes("secrets-to-ielts-success")) {
      courseMatch = COURSES["secrets-to-ielts-success"] || COURSES["ielts-mock-secrets"];
    }

    if (courseMatch) {
      const courseRecord = {
        id: courseMatch.id,
        resource_id: r.id,
        title: courseMatch.title,
        description: courseMatch.description,
        pdf_url: finalUrl, // use the newly uploaded storage URL
        chapters_json: courseMatch.chapters,
      };

      const { error: courseError } = await supabase.from("courses").upsert(courseRecord);

      if (courseError) {
        console.error(`  ✗ Failed to insert course ${courseMatch.id}: ${courseError.message}`);
      } else {
        console.log(`  ✓ Inserted course: ${courseMatch.id}`);
      }
    }
  }

  console.log("\nMigration completed successfully!");
}

migrate().catch(console.error);
