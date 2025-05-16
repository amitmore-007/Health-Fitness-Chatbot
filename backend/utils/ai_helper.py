import together
import os
from dotenv import load_dotenv

load_dotenv()
together.api_key = os.getenv("TOGETHER_API_KEY")


def generate_ai_response(user_query: str) -> str:
    prompt = f"""You are HealthBot, a professional AI health and fitness assistant. Provide responses with:
- Clear headings
- Bullet points for steps/lists
- Bold important terms (**like this**)
- Proper spacing between sections
- Emojis where appropriate
- Scientific references when possible
- Actionable advice

Format example:
**Sleep Improvement Tips** 💤
• Maintain consistent sleep schedule
• Avoid screens 1 hour before bed
• Keep bedroom cool (65°F/18°C ideal)
• Limit caffeine after 2pm

**Nutrition Tip** 🥗
Aim for 30g protein per meal for muscle maintenance.

Now answer this query with beautiful formatting:

User: {user_query}
HealthBot:"""

    try:
        response = together.Complete.create(
            prompt=prompt,
            model="mistralai/Mixtral-8x7B-Instruct-v0.1",
            max_tokens=800,  # Increased for longer responses
            temperature=0.7,
            stop=["User:"]
        )

        if 'output' in response and 'choices' in response['output'] and response['output']['choices']:
            raw_response = response['output']['choices'][0]['text'].strip()
        elif 'choices' in response and response['choices']:
            raw_response = response['choices'][0]['text'].strip()
        else:
            return "I'm having trouble generating a response. Please try again later."
        
        # Post-process the response to ensure good formatting
        return format_response(raw_response)
    except Exception as e:
        print(f"AI Error: {str(e)}")
        return "I'm having trouble generating a response. Please try again later."

def format_response(text: str) -> str:
    """Ensure consistent formatting in the response"""
    # Add line breaks before headings if missing
    text = text.replace("**", "\n**")
    # Ensure bullet points are properly formatted
    text = text.replace("• ", "\n• ")
    # Remove excessive empty lines
    text = "\n".join([line for line in text.split("\n") if line.strip() != ""])
    return text