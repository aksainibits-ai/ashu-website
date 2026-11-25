import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { profile } from "@/lib/content";

export const dynamic = "force-dynamic";

const answers = {
  en: [
    { keys: ["hello", "hi", "help", "start"], answer: "Hello. I can share brief, general information about common Indian legal topics and this website. I cannot assess an individual case or provide legal advice. What general topic would you like to understand?" },
    { keys: ["contact", "phone", "email", "address", "office", "location"], answer: `The public professional contact details shown on this website are: ${profile.phone} and ${profile.email}. The profile lists ${profile.location}. Please do not send confidential case details or documents through chat. This information does not confirm availability or representation.` },
    { keys: ["writ", "article 32", "article 226"], answer: "In general, Article 32 of the Constitution allows a person to approach the Supreme Court for enforcement of Fundamental Rights. Article 226 gives High Courts power to issue writs for Fundamental Rights and for other legal purposes, subject to constitutional principles. The appropriate remedy depends on the facts and applicable law; consult the Constitution and relevant court rules." },
    { keys: ["cheque", "138", "negotiable instruments"], answer: "Section 138 of the Negotiable Instruments Act, 1881 concerns dishonour of a cheque for specified reasons, subject to statutory conditions such as a legally enforceable debt or liability, timely demand notice and limitation periods. The Act and current court decisions should be checked for the applicable procedure. This is general information, not an assessment of any particular cheque." },
    { keys: ["property", "land", "registry", "mutation", "ownership"], answer: "Property matters can involve title documents, registration, stamp duty, mutation, possession, local land records and limitation. Mutation entries by themselves are generally not conclusive proof of title. The applicable law and process depend on the property type and state. Check official state registration and land-record portals." },
    { keys: ["criminal", "fir", "arrest", "bail", "police"], answer: "Criminal procedure in India is governed principally by the Bharatiya Nagarik Suraksha Sanhita, 2023, alongside the Bharatiya Nyaya Sanhita, 2023 and Bharatiya Sakshya Adhiniyam, 2023, subject to commencement provisions and special laws. FIR, arrest, bail and investigation rules are fact-sensitive. For current text, use India Code and official court resources." },
    { keys: ["civil", "suit", "limitation", "court case"], answer: "Civil proceedings may involve jurisdiction, cause of action, limitation, pleadings, court fees, evidence and interim relief. The Code of Civil Procedure, 1908 and the Limitation Act, 1963 are important general statutes, but special laws may apply. Limitation periods vary by claim and circumstances." },
    { keys: ["supreme court", "high court", "district court", "jurisdiction"], answer: "India has a Supreme Court, High Courts and subordinate courts, each with constitutionally and statutorily defined jurisdiction. The correct forum depends on the subject matter, territorial and pecuniary jurisdiction, statute and procedural posture. Consult the relevant court's official website and rules." },
    { keys: ["privacy", "data", "personal information"], answer: "Please do not enter names, phone numbers, email addresses, case facts, identity numbers, documents or confidential information here. The chatbot is designed for general information only. See the website Privacy Policy for information about website data handling." },
    { keys: ["advice", "my case", "my matter", "what should i do", "legal notice"], answer: "I cannot advise on an individual matter, review documents, recommend a case strategy or predict an outcome. Please consult an independently chosen advocate after reviewing the relevant documents and deadlines. Do not share case details in this chat." },
    { keys: ["disclaimer", "lawyer client", "representation"], answer: "This chatbot provides general legal information only. It is not legal advice, does not create an advocate-client relationship, does not accept instructions and does not confirm representation. Laws and procedures may change; verify information against current official sources." }
  ],
  hi: [
    { keys: ["नमस्ते", "हेलो", "मदद", "शुरू"], answer: "नमस्ते। मैं भारतीय कानून के सामान्य विषयों और इस वेबसाइट के बारे में संक्षिप्त सामान्य जानकारी दे सकता हूँ। मैं किसी व्यक्तिगत मामले का आकलन या कानूनी सलाह नहीं दे सकता। आप किस सामान्य विषय को समझना चाहते हैं?" },
    { keys: ["संपर्क", "फोन", "फ़ोन", "ईमेल", "पता", "कार्यालय", "स्थान"], answer: `वेबसाइट पर उपलब्ध सार्वजनिक व्यावसायिक संपर्क विवरण: ${profile.phone} और ${profile.email}। प्रोफ़ाइल में स्थान ${profile.location} दिया गया है। चैट में गोपनीय मामले का विवरण या दस्तावेज़ साझा न करें। यह जानकारी उपलब्धता या प्रतिनिधित्व की पुष्टि नहीं करती।` },
    { keys: ["रिट", "अनुच्छेद 32", "अनुच्छेद 226"], answer: "सामान्यतः संविधान का अनुच्छेद 32 मौलिक अधिकारों के प्रवर्तन के लिए सर्वोच्च न्यायालय जाने का अधिकार देता है। अनुच्छेद 226 के तहत उच्च न्यायालय मौलिक अधिकारों तथा अन्य कानूनी उद्देश्यों के लिए रिट जारी कर सकते हैं। उचित उपाय तथ्यों और लागू कानून पर निर्भर करता है। संविधान और संबंधित न्यायालय के नियम देखें।" },
    { keys: ["चेक", "138", "परक्राम्य लिखत"], answer: "परक्राम्य लिखत अधिनियम, 1881 की धारा 138 कुछ परिस्थितियों में चेक अनादरण से संबंधित है। इसमें वैध देयता, समय पर मांग नोटिस और परिसीमा जैसी वैधानिक शर्तें शामिल हैं। लागू प्रक्रिया के लिए अधिनियम का वर्तमान पाठ और न्यायालयों के निर्णय देखें। यह किसी विशेष चेक का कानूनी आकलन नहीं है।" },
    { keys: ["संपत्ति", "जमीन", "भूमि", "रजिस्ट्री", "नामांतरण", "मालिकाना"], answer: "संपत्ति संबंधी मामलों में स्वामित्व दस्तावेज़, पंजीकरण, स्टाम्प शुल्क, नामांतरण, कब्ज़ा, स्थानीय भूमि रिकॉर्ड और परिसीमा महत्वपूर्ण हो सकते हैं। केवल नामांतरण प्रविष्टि सामान्यतः स्वामित्व का निर्णायक प्रमाण नहीं होती। राज्य के आधिकारिक पंजीकरण और भूमि रिकॉर्ड पोर्टल देखें।" },
    { keys: ["आपराधिक", "एफआईआर", "गिरफ्तारी", "जमानत", "पुलिस"], answer: "भारत में आपराधिक प्रक्रिया मुख्यतः भारतीय नागरिक सुरक्षा संहिता, 2023 के अंतर्गत आती है; भारतीय न्याय संहिता, 2023 और भारतीय साक्ष्य अधिनियम, 2023 भी प्रासंगिक हैं। एफआईआर, गिरफ्तारी, जमानत और जांच के नियम तथ्यों पर निर्भर करते हैं। वर्तमान कानून के लिए India Code और आधिकारिक न्यायालय स्रोत देखें।" },
    { keys: ["दीवानी", "सिविल", "वाद", "मुकदमा", "परिसीमा"], answer: "दीवानी कार्यवाही में न्यायालय का क्षेत्राधिकार, वाद का कारण, परिसीमा, pleadings, न्यायालय शुल्क, साक्ष्य और अंतरिम राहत जैसे विषय हो सकते हैं। सिविल प्रक्रिया संहिता, 1908 और परिसीमा अधिनियम, 1963 महत्वपूर्ण सामान्य कानून हैं। लागू समय-सीमा दावे और परिस्थितियों के अनुसार बदलती है।" },
    { keys: ["सर्वोच्च न्यायालय", "उच्च न्यायालय", "जिला न्यायालय", "क्षेत्राधिकार"], answer: "भारत में सर्वोच्च न्यायालय, उच्च न्यायालय और अधीनस्थ न्यायालय हैं। प्रत्येक का क्षेत्राधिकार संविधान और कानून से निर्धारित होता है। सही न्यायालय विषय, क्षेत्र, आर्थिक अधिकारिता, लागू अधिनियम और कार्यवाही की स्थिति पर निर्भर करता है। संबंधित न्यायालय की आधिकारिक वेबसाइट और नियम देखें।" },
    { keys: ["गोपनीयता", "डेटा", "निजी जानकारी"], answer: "कृपया यहाँ नाम, फोन नंबर, ईमेल, मामले के तथ्य, पहचान संख्या, दस्तावेज़ या गोपनीय जानकारी दर्ज न करें। यह चैटबॉट केवल सामान्य जानकारी के लिए है। वेबसाइट पर डेटा के उपयोग के बारे में गोपनीयता नीति देखें।" },
    { keys: ["सलाह", "मेरा मामला", "मेरे केस", "क्या करना चाहिए", "कानूनी नोटिस"], answer: "मैं किसी व्यक्तिगत मामले पर सलाह, दस्तावेज़ों की समीक्षा, मुकदमे की रणनीति या परिणाम का अनुमान नहीं दे सकता। संबंधित दस्तावेज़ और समय-सीमा देखकर स्वतंत्र रूप से चुने गए अधिवक्ता से परामर्श करें। इस चैट में मामले का विवरण साझा न करें।" },
    { keys: ["अस्वीकरण", "वकील-मुवक्किल", "प्रतिनिधित्व"], answer: "यह चैटबॉट केवल सामान्य कानूनी जानकारी देता है। यह कानूनी सलाह नहीं है, अधिवक्ता-मुवक्किल संबंध नहीं बनाता, निर्देश स्वीकार नहीं करता और प्रतिनिधित्व की पुष्टि नहीं करता। कानून और प्रक्रिया बदल सकते हैं; वर्तमान आधिकारिक स्रोतों से पुष्टि करें।" }
  ]
} as const;

function matchesKeyword(message: string, keyword: string) {
  const key = keyword.toLocaleLowerCase().trim();
  if (/[\u0900-\u097f]/u.test(key)) return message.includes(key);
  const escaped = key.replace(/[.*+?^{}()|[\]\\]/g, (character) => "\\" + character).replace(/\s+/g, "\\s+");
  return new RegExp("(?:^|[^a-z0-9])" + escaped + "(?:$|[^a-z0-9])", "i").test(message);
}

function getAnswer(message: string, language: "en" | "hi") {
  const normalized = message.normalize("NFC").toLocaleLowerCase();
  const match = answers[language].find((entry) => entry.keys.some((key) => matchesKeyword(normalized, key)));
  if (match) return match.answer;
  return language === "hi"
    ? "इस विषय पर मेरे पास अभी उपलब्ध FAQ संग्रह में उत्तर नहीं है। कृपया India Code, संबंधित न्यायालय की आधिकारिक वेबसाइट या सरकारी स्रोत देखें। मैं व्यक्तिगत कानूनी सलाह नहीं दे सकता।"
    : "I could not find a matching topic in the available FAQ library. Please consult India Code, the relevant court's official website or another government source. I cannot provide individual legal advice.";
}

export async function POST(request: Request) {
  if (process.env.ENABLE_CHATBOT !== "true") return NextResponse.json({ error: "The chatbot is currently disabled." }, { status: 403 });
  try {
    const origin = request.headers.get("origin");
    const expected = process.env.NEXT_PUBLIC_SITE_URL;
    if (!origin || !expected || new URL(origin).origin !== new URL(expected).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "JSON requests only." }, { status: 415 });
    }
    if (!(await enforceRateLimit(request, "chatbot", 15, 3600))) return NextResponse.json({ error: "Please try again later." }, { status: 429 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== "string" || body.message.trim().length < 2 || body.message.length > 1800) {
      return NextResponse.json({ error: "Enter a general question of up to 1,800 characters." }, { status: 400 });
    }
    const message = body.message.trim();
    const compact = message.replace(/[\s-]/g, "");
    const containsEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(message);
    const containsPhone = /(?:\+?91[- ]?)?[6-9]\d{9}/.test(message);
    const containsAadhaarLikeNumber = /(?:^|\D)\d{12}(?:\D|$)/.test(compact);
    const containsPanLikeNumber = /\b[A-Z]{5}\d{4}[A-Z]\b/i.test(message);
    if (containsEmail || containsPhone || containsAadhaarLikeNumber || containsPanLikeNumber) {
      return NextResponse.json({ error: "Please remove personal contact details and ask only a general legal question." }, { status: 400 });
    }
    const language = body.language === "hi" ? "hi" : "en";
    return NextResponse.json({ answer: getAnswer(message, language) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 503 });
  }
}
