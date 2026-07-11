# ============================================
# SOLOMON COATINGS - PRODUCTION SETUP SCRIPT
# Run this ONCE on a fresh machine to clone & deploy
# ============================================

echo "========================================"
echo " SOLOMON COATINGS AI - SETUP"
echo " v13.0 - Roast My Rust Edition"
echo "========================================"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Download from https://nodejs.org (v18 or later)"
    exit 1
fi
echo "Node.js: $(node -v)"

# 2. Clone the repo
echo ""
echo "Cloning repository..."
git clone https://github.com/bournemust-rgb/solomon-ai.git
cd solomon-ai

# 3. Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# 4. Create .env template
echo ""
echo "Creating .env file..."
cat <<ENVEOF > .env
# Gemini AI
GEMINI_API_KEY=your_gemini_key_here

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_APP_SECRET=your_app_secret_here
WHATSAPP_VERIFY_TOKEN=solomon_coatings_1988

# Upstash Redis
UPSTASH_REDIS_URL=your_upstash_redis_url_here
ENVEOF

# 5. Create photos directory
mkdir -p public/photos
echo "Add your work photos here (gate-charcoal-1.jpg, rim-gloss-black-1.jpg, etc.)" > public/photos/README.txt

echo ""
echo "========================================"
echo " SETUP COMPLETE"
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo "1. Edit .env with your real keys"
echo "2. Add photos to public/photos/"
echo "3. Update SHELF array in index.js with your photo names"
echo "4. Run: npm start"
echo "5. Test: http://localhost:3000/health"
echo ""
echo "To deploy to Render:"
echo "1. Push to GitHub: git push origin main"
echo "2. Render will auto-deploy"
echo "3. Set environment variables in Render dashboard"
echo ""
echo "Bot features:"
echo "  - Conversational flow (product -> condition -> weight -> colour -> quote)"
echo "  - Price calculator with VAT breakdown"
echo "  - Bulk parser (20kg gate + 4 rims)"
echo "  - Roast My Rust photo responses"
echo "  - Voice note handling"
echo "  - Contractor mode (8% auto-discount)"
echo "  - Loadshedding-aware quotes"
echo "  - Delivery distance calculator"
echo "  - Owner commands (workload, report, done, contractor, loadshedding)"
echo "  - After-hours auto-reply with owner notification"
echo "  - TPS Daily Wisdom (18 family sayings)"
echo "  - Cape Town personality engine"
echo "  - Photo forwarding to owner"
echo "  - Friday vibes"
echo "  - Returning customer detection"
echo ""
