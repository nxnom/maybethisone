# maybethisone

A CLI tool and MCP server to check name availability across multiple platforms - GitHub, npm, Twitter/X, LinkedIn, and domains.

## Installation

```bash
# Clone the repo
git clone https://github.com/nxnom/maybethisone.git
cd maybethisone

# Install dependencies
bun install

# Install Playwright browsers (first time only)
bunx playwright install chromium
```

## Usage

```bash
# Check a single name
bun run src/index.ts myproject

# Check multiple names
bun run src/index.ts myproject coolstartup brandname
```

## What it checks

| Platform  | Resource                                             |
| --------- | ---------------------------------------------------- |
| GitHub    | Organization (`github.com/orgs/name`)                |
| npm       | Package name (`npmjs.com/package/name`)              |
| npm       | Organization scope (`@name/...`)                     |
| Twitter/X | Username (`x.com/name`)                              |
| LinkedIn  | Company page (`linkedin.com/company/name`)           |
| Domains   | `.com`, `.dev`, `.io`, `.org`, `.net`, `.co`, `.app` |

## Output

```
🔍 maybethisone - Name Availability Checker

Results for: myproject

┌────────────────────────────────────────┬────────────────────┐
│ Resource                               │ Status             │
├────────────────────────────────────────┼────────────────────┤
│ github.com/orgs/myproject              │ ✓ Available        │
├────────────────────────────────────────┼────────────────────┤
│ npm package: myproject                 │ ✗ Taken            │
├────────────────────────────────────────┼────────────────────┤
│ npm org: @myproject                    │ ✗ Taken            │
├────────────────────────────────────────┼────────────────────┤
│ x.com/myproject                        │ ✗ Taken            │
├────────────────────────────────────────┼────────────────────┤
│ linkedin.com/company/myproject         │ ✓ Available        │
├────────────────────────────────────────┼────────────────────┤
│ myproject.com                          │ ✗ Taken            │
├────────────────────────────────────────┼────────────────────┤
│ myproject.dev                          │ ~ No DNS           │
└────────────────────────────────────────┴────────────────────┘
```

### Status Legend

| Status        | Meaning                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `✓ Available` | Confirmed available                                                    |
| `✗ Taken`     | Confirmed taken                                                        |
| `~ Maybe`     | npm package - may conflict with normalized names or private packages   |
| `~ No DNS`    | No DNS record found (domain may still be registered - verify manually) |
| `? Error`     | Check failed                                                           |

## MCP Server (for AI Agents)

maybethisone includes an MCP (Model Context Protocol) server that allows AI agents like Claude to check name availability.

### Tools Available

| Tool                         | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `check_name_availability`    | Full check - all platforms including social media (uses browser) |
| `check_name_availability_quick` | Quick check - GitHub, npm package, and .com domain only (no browser) |

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "maybethisone": {
      "command": "npx",
      "args": ["maybethisone-mcp"]
    }
  }
}
```

Or if installed locally:

```json
{
  "mcpServers": {
    "maybethisone": {
      "command": "node",
      "args": ["/path/to/maybethisone/dist/mcp.js"]
    }
  }
}
```

### Example Response

```json
{
  "name": "myproject",
  "results": [
    { "resource": "github.com/orgs/myproject", "status": "available" },
    { "resource": "npm package: myproject", "status": "taken" },
    { "resource": "myproject.com", "status": "taken" }
  ]
}
```

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── mcp.ts                # MCP server entry point
├── types.ts              # TypeScript type definitions
├── checkers/
│   ├── index.ts          # Re-exports all checkers
│   ├── github.ts         # GitHub org checker
│   ├── npm.ts            # npm package & org checker
│   ├── twitter.ts        # Twitter/X checker
│   ├── linkedin.ts       # LinkedIn checker
│   └── domain.ts         # Domain DNS checker
└── utils/
    ├── browser.ts        # Playwright browser management
    └── logger.ts         # Progress logging utilities
```

## Limitations

- **npm package names**: npm normalizes package names (e.g., `my-pkg` and `my_pkg` are considered the same) and private packages are not visible, so even if the exact name appears available, publishing may still fail
- **Domain checks**: Uses DNS lookup which may show false positives for registered domains without DNS records
- **Rate limiting**: Some platforms may rate limit requests if checking many names
- **Bot protection**: Twitter/X, LinkedIn, and npm org checks use Playwright to bypass Cloudflare/bot protection
