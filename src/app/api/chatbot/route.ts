import { NextRequest, NextResponse } from "next/server";

// POST /api/chatbot
// Simple rule-based chatbot for Cooking with Chipo
// Can be upgraded to OpenAI GPT by replacing the response logic
export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json();
    const lowerMsg = message.toLowerCase().trim();

    // Rule-based responses
    let response = "";
    let actions: { type: string; label: string; url: string }[] = [];

    if (lowerMsg.includes("class") || lowerMsg.includes("schedule") || lowerMsg.includes("when")) {
      response = "Chipo has upcoming masterclasses every weekend! You can browse all classes and register on our Classes page. Would you like me to take you there?";
      actions = [{ type: "link", label: "Browse Classes", url: "/classes" }];
    } else if (lowerMsg.includes("price") || lowerMsg.includes("cost") || lowerMsg.includes("how much")) {
      response = "Classes start from just $5 USD! We also have recipe kits at $12 and premium masterclasses at $10-$30. All payments accept EcoCash and cards.";
      actions = [{ type: "link", label: "View Pricing", url: "/classes" }];
    } else if (lowerMsg.includes("spice") || lowerMsg.includes("shop") || lowerMsg.includes("buy")) {
      response = "You can buy Chipo's Rosella spices, recipe kits, and branded merchandise from our online shop. We deliver nationwide in Zimbabwe!";
      actions = [{ type: "link", label: "Visit Shop", url: "/shop" }];
    } else if (lowerMsg.includes("certificate") || lowerMsg.includes("certified")) {
      response = "Yes! Every student who completes a class receives a branded Certificate of Completion from Cooking with Chipo. You can download it from your dashboard.";
      actions = [{ type: "link", label: "My Dashboard", url: "/dashboard" }];
    } else if (lowerMsg.includes("payment") || lowerMsg.includes("ecocash") || lowerMsg.includes("pay")) {
      response = "We accept EcoCash (via Paynow), OneMoney, Telecash, and all major cards (Visa/Mastercard via Selar). Choose your preferred method at checkout.";
    } else if (lowerMsg.includes("whatsapp") || lowerMsg.includes("contact") || lowerMsg.includes("phone")) {
      response = "You can reach Chipo directly on WhatsApp! Click the WhatsApp button in the menu, or send a message to our business line.";
      actions = [{ type: "link", label: "Chat on WhatsApp", url: "https://wa.me/263XXXXXXXXX" }];
    } else if (lowerMsg.includes("affiliate") || lowerMsg.includes("earn") || lowerMsg.includes("refer")) {
      response = "Join our affiliate program and earn 10% commission for every friend you refer who makes a purchase! It's free to join.";
      actions = [{ type: "link", label: "Join Affiliate Program", url: "/affiliate" }];
    } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      response = "Hello! 👩‍🍳 Welcome to Cooking with Chipo! I'm your virtual assistant. Ask me about classes, spices, payments, certificates, or anything else!";
    } else if (lowerMsg.includes("help")) {
      response = "I can help you with:\n• Finding and registering for classes\n• Buying Rosella spices and merchandise\n• Payment methods (EcoCash, cards)\n• Certificates and your dashboard\n• The affiliate program\n• Contacting Chipo\n\nWhat would you like to know?";
    } else {
      response = "I'm not sure I understand. Try asking about:\n• Upcoming classes\n• Spice shop\n• Payment methods\n• Certificates\n• Affiliate program\n• Or type 'help' for all options!";
    }

    // TODO: For production, integrate OpenAI here:
    // const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', ...)

    return NextResponse.json({
      response,
      actions,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
