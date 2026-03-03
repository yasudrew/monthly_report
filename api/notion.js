export default async function handler(req, res) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
  
    const { pageId } = req.query;
    if (!pageId) return res.status(400).json({ error: "pageId is required" });
  
    const NOTION_KEY = process.env.NOTION_API_KEY;
    if (!NOTION_KEY) return res.status(500).json({ error: "NOTION_API_KEY not configured" });
  
    try {
      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
          "Authorization": `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
        },
      });
  
      if (!response.ok) {
        const err = await response.json();
        return res.status(response.status).json({ error: err.message || "Notion API error" });
      }
  
      const page = await response.json();
      const props = page.properties;
  
      // Helper: extract rich_text
      const getText = (prop) => {
        if (!prop) return "";
        if (prop.type === "rich_text") return prop.rich_text.map(t => t.plain_text).join("");
        if (prop.type === "title") return prop.title.map(t => t.plain_text).join("");
        return "";
      };
  
      // Helper: extract select
      const getSelect = (prop) => prop?.select?.name || "";
  
      // Helper: extract multi_select
      const getMultiSelect = (prop) => (prop?.multi_select || []).map(s => s.name);
  
      // Map to generator format
      const data = {
        school: getText(props["学校名"]),
        month: getText(props["対象月"]),
        cdn: getMultiSelect(props["CDN担当"]),
        phase: getSelect(props["商品セグ、フェーズ"]),
        activities: getMultiSelect(props["実施業務"]),
        deliverables: getText(props["成果物"]),
        summary: getText(props["活動サマリー"]),
        teacherComment: getText(props["先生のコメント"]),
        nextMonth: getText(props["来月の予定"]),
        notes: getText(props["備考"]),
        status: getSelect(props["ステータス"]),
        pageId: pageId,
      };
  
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }