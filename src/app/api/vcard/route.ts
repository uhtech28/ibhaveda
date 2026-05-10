export async function GET() {
    const vcard = `BEGIN:VCARD
  VERSION:3.0
  FN:Aryan Awasthi
  ORG:Interactive Ideas
  TITLE:Founder
  TEL;TYPE=CELL:+91 9810036751
  EMAIL:aryanvawasthi@gmail.com
  URL:https://theinteractiveideas.com/
  URL;TYPE=LinkedIn:https://www.linkedin.com/in/aryan-v-awasthi/
  URL;TYPE=Instagram:https://www.instagram.com/theinteractiveideas/
  URL;TYPE=X:https://x.com/AryanVAwasthi
  END:VCARD`;
  
    return new Response(vcard, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": 'inline; filename="aryan-awasthi.vcf"',
        "Cache-Control": "no-store",
      },
    });
  }