import { NextResponse } from "next/server";

export async function GET() {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_key_here";
  const hasNotionToken = !!process.env.NOTION_TOKEN && process.env.NOTION_TOKEN !== "your_notion_integration_token_here";
  const hasNotionDb = !!process.env.NOTION_DATABASE_ID;

  // Quick Notion connectivity test
  let notionConnected = false;
  let notionError = "";
  if (hasNotionToken && hasNotionDb) {
    try {
      const res = await fetch(
        `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
          },
        }
      );
      if (res.ok) {
        const db = await res.json();
        notionConnected = true;
        // Check for Build Spec field
        const hasBuildSpec = "Build Spec" in (db.properties ?? {});
        return NextResponse.json({
          anthropic: hasAnthropic,
          notionToken: hasNotionToken,
          notionDb: hasNotionDb,
          notionConnected,
          hasBuildSpecField: hasBuildSpec,
          databaseTitle: db.title?.[0]?.plain_text ?? "Untitled",
        });
      } else {
        notionError = `Notion API returned ${res.status}`;
      }
    } catch (e) {
      notionError = String(e);
    }
  }

  return NextResponse.json({
    anthropic: hasAnthropic,
    notionToken: hasNotionToken,
    notionDb: hasNotionDb,
    notionConnected,
    hasBuildSpecField: false,
    notionError,
    databaseTitle: null,
  });
}
