import { NextResponse } from 'next/server';

const VCARD = `BEGIN:VCARD
VERSION:3.0
N:Awasthi;Aryan;;;
FN:Aryan Awasthi
ORG:Ibhaveda
TITLE:Founder
TEL;TYPE=CELL:+91 9810036751
EMAIL:aryanvawasthi@gmail.com
URL:https://ibhaveda.com/
URL;TYPE=LinkedIn:https://www.linkedin.com/in/aryan-v-awasthi/
URL;TYPE=Instagram:https://www.instagram.com/ibhaveda/
URL;TYPE=X:https://x.com/ibhaveda
END:VCARD`;

export async function GET() {
  return new NextResponse(VCARD, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Refresh': '4; url=https://ibhaveda.com/',
    },
  });
}
