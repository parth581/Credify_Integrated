import requests
import os

HF_API_KEY = os.getenv("HF_API_KEY")

# CORRECT: OpenAI-compatible endpoint
url = "https://router.huggingface.co/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}

# Test different models
models = [
    "meta-llama/Llama-3.2-3B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "Qwen/Qwen2.5-7B-Instruct"
]

for model in models:
    print(f"Testing: {model}")
    
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": "Say hello in one sentence"}
        ],
        "max_tokens": 50
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS!")
            print(f"Response: {result['choices'][0]['message']['content']}")
        else:
            print(f"❌ FAILED: {response.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    print("-" * 60)