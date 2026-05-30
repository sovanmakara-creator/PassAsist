import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://gpjkpyihxbkwyzkfhvrt.supabase.co";
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_jzU9bi4uUJfU_sdlWyVauw_y-W_M7Cd";
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CONTENT = `# Creator Portfolio

Welcome! My name is Sovanmakara (Janric), a 20-year-old software engineering student from Siem Reap, Cambodia.

## Profile
- **Name**: Sovanmakara Pov (Janric)
- **Role**: Software Engineering Student & Developer
- **Phone / Telegram / WhatsApp**: +855 887821790
- **Socials**: [Facebook: Sovanmkara POV](https://facebook.com) | [Instagram: @janric_sp](https://instagram.com/janric_sp)

## Background
I am a former Grade A student (99.503 score) from Somdach Ouv High School (Class of 2023-2024), where I was the top student in class. My ambition is to help the Technology industry grow in Cambodia as a dedicated software engineer. I have a strong interest in Software Development and have been taking web development courses since high school.

## Education & Languages
- **High School**: Somdach Ouv High School, Siem Reap (Grade A, 99.503)
- **Languages**: 
  - English: Upper-Intermediate (ACE, 2024)
  - Thai: Pre-intermediate (Rajabat Buriram University, 2025)
  - Khmer: Native

## Skills & Technologies
- **Programming Languages**: C#, C++, JavaScript, PHP (Basic)
- **Web Technologies**: HTML, CSS, Bootstrap, jQuery
- **Tools**: GitHub, VS Code, AWS Basics
- **Design Tools**: Adobe Photoshop, Adobe Illustrator, Canva
- **Soft Skills**: Teamwork, Communication, Leadership, Presentation

## Certifications & Achievements
- **AWS Certified Cloud Practitioner**
- **Cloud4Cambodia Battambang Program** (AWS Cloud Bootcamp)
- **TOEFL ITP**: Score 507
- **English Public Speaking Training Course**
- **PSU Futsal International Open 2025**

## Personal Interests
Beyond coding, I enjoy music & art, creating vlogs, adopting new technologies, gaming, designing, going to the gym, and reading.`;

async function main() {
  const { data, error } = await supabase
    .from('pages')
    .update({ content: DEFAULT_CONTENT })
    .eq('slug', 'portfolio');

  if (error) {
    console.error('Error updating Supabase:', error);
  } else {
    console.log('Successfully updated Supabase!');
  }
}

main();
