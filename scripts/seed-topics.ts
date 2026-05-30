import { createClient } from "@supabase/supabase-js";
import {
  TOEFL_TOPICS,
  TOEIC_TOPICS,
  IELTS_SPEAKING_TOPICS,
  TOEFL_SPEAKING_TOPICS,
  TOEIC_SPEAKING_TOPICS,
} from "../src/services/topic-bank";

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

interface TopicInsert {
  exam: string;
  part: string;
  prompt_text: string;
  image_url?: string | null;
}

async function seed() {
  console.log("Starting Supabase Topics Seeding...");

  // Build the list of topics to insert
  const topicsToSeed: TopicInsert[] = [];

  // 1. TOEFL Writing
  for (const [part, list] of Object.entries(TOEFL_TOPICS)) {
    for (const prompt of list) {
      topicsToSeed.push({
        exam: "toefl_writing",
        part,
        prompt_text: prompt,
      });
    }
  }

  // 2. TOEIC Writing
  for (const [part, list] of Object.entries(TOEIC_TOPICS)) {
    for (const prompt of list) {
      topicsToSeed.push({
        exam: "toeic_writing",
        part,
        prompt_text: prompt,
      });
    }
  }

  // 3. IELTS Speaking
  for (const [part, list] of Object.entries(IELTS_SPEAKING_TOPICS)) {
    for (const prompt of list) {
      topicsToSeed.push({
        exam: "ielts_speaking",
        part,
        prompt_text: prompt,
      });
    }
  }

  // 4. TOEFL Speaking
  for (const [part, list] of Object.entries(TOEFL_SPEAKING_TOPICS)) {
    for (const prompt of list) {
      topicsToSeed.push({
        exam: "toefl_speaking",
        part,
        prompt_text: prompt,
      });
    }
  }

  // 5. TOEIC Speaking
  for (const [part, list] of Object.entries(TOEIC_SPEAKING_TOPICS)) {
    for (const prompt of list) {
      topicsToSeed.push({
        exam: "toeic_speaking",
        part,
        prompt_text: prompt,
      });
    }
  }

  console.log(`Found ${topicsToSeed.length} static topics to seed into the database.`);

  // Let's retrieve existing topics to avoid duplicates
  const { data: existing, error: fetchError } = await supabase
    .from("topics")
    .select("exam, part, prompt_text");

  if (fetchError) {
    console.error("Error checking existing topics (have you run setup_topics.sql?):", fetchError.message);
    console.log("\nMake sure to run setup_topics.sql in your Supabase SQL Editor first!");
    process.exit(1);
  }

  const existingSet = new Set(
    existing?.map((t) => `${t.exam}|${t.part}|${t.prompt_text}`) || []
  );

  const newTopics = topicsToSeed.filter(
    (t) => !existingSet.has(`${t.exam}|${t.part}|${t.prompt_text}`)
  );

  console.log(`Filtering complete: ${newTopics.length} new topics will be seeded.`);

  if (newTopics.length === 0) {
    console.log("No new topics to seed. All are already present in the database.");
    return;
  }

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < newTopics.length; i += batchSize) {
    const batch = newTopics.slice(i, i + batchSize);
    const { error: insertError } = await supabase.from("topics").insert(batch);
    if (insertError) {
      console.error(`✗ Error inserting batch starting at index ${i}:`, insertError.message);
    } else {
      console.log(`✓ Seeded batch starting at index ${i} (${batch.length} items)`);
    }
  }

  console.log("\nTopics seeding completed successfully!");
}

seed().catch(console.error);
