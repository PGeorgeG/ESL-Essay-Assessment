# Writing Analysis — Railway Deployment

## Files
- `server.js` — Express server (password auth + Anthropic API proxy)
- `esl-checker.html` — The app
- `package.json` — Node dependencies

## Deploy to Railway

### 1. Create a GitHub repository
- Go to github.com → New repository → name it `writing-analysis`
- Upload these three files: `server.js`, `esl-checker.html`, `package.json`, `.gitignore`

### 2. Deploy on Railway
- Go to railway.app → New Project → Deploy from GitHub repo
- Select your repository
- Railway will detect Node.js and deploy automatically

### 3. Set environment variables
In Railway dashboard → your project → Variables, add:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (starts with `sk-ant-...`) |
| `APP_PASSWORD` | Any password you choose |
| `NODE_ENV` | `production` |

### 4. Get your URL
Railway assigns a URL like `writing-analysis-production.up.railway.app`
You can set a custom domain in Railway settings.

## Updating the app
When you get an updated `esl-checker.html` from Claude:
1. Replace the file in your GitHub repo
2. Railway redeploys automatically (takes ~30 seconds)

## Changing the password
Go to Railway → Variables → change `APP_PASSWORD` → Railway redeploys.

## Costs
- Railway: free tier available, ~$5/month for always-on
- Anthropic API: ~$0.25–0.35 per class of 20 students analysed
