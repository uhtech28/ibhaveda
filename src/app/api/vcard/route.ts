export async function GET() {
    const vcard = `BEGIN:VCARD
  VERSION:3.0
  N:Awasthi;Aryan;;;
  FN:Aryan Awasthi
  ORG:Interactive Ideas
  TITLE:Founder
  TEL;TYPE=CELL:+91 9810036751
  EMAIL:aryanvawasthi@gmail.com
  URL:https://theinteractiveideas.com/
  
  item1.URL:https://www.linkedin.com/in/aryan-v-awasthi/
  item1.X-ABLabel:LinkedIn
  
  item2.URL:https://www.instagram.com/theinteractiveideas/
  item2.X-ABLabel:Instagram
  
  item3.URL:https://x.com/AryanVAwasthi
  item3.X-ABLabel:X
  
  END:VCARD`;
  
    return new Response(vcard, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": 'inline; filename="aryan-awasthi.vcf"',
      },
    });
  }