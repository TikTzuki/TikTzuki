# MCP-Atlassian Integration Guide

## Pre-requisites
Install Docker (if not already installed)
Visit https://docs.docker.com/engine/install/ and follow the instructions.

## 🔐 Authentication Setup

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**, name it
3. Copy the **API_TOKEN** immediately

## Integrate MCP Server
### With Cursor
Source: [Cursor MCP](https://developers.make.com/mcp-server/make-cloud-mcp-server/usage-with-cursor), [Usage](https://docs.cursor.com/en/context/mcp)

To use the cloud-based server with Cursor:

- Open your Cursor account.

- On the upper right-hand side, click the gear icon to open the Cursor Settings dialog.

- In the left sidebar, click Tools & Integrations.

- Under MCP Tools, click New MCP Server to open the editor for the mcp.json file.

![image.png](https://developers.make.com/~gitbook/image?url=https%3A%2F%2F3035801395-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FyHSLDvK9bMDQI1lCXXt6%252Fuploads%252FSzGd2KAWMGDzFWnEQfpS%252Fimage%2520%285%29.png%3Falt%3Dmedia%26token%3Daa4eadff-b879-4143-9eed-a89e3a8cf306&width=768&dpr=2&quality=100&sign=d62d5d20&sv=2)
Configuration mcp.json examples
```json
{
  "mcpServers": {
    "mcp-atlassian": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "CONFLUENCE_URL",
        "-e",
        "CONFLUENCE_USERNAME",
        "-e",
        "CONFLUENCE_API_TOKEN",
        "-e",
        "JIRA_URL",
        "-e",
        "JIRA_USERNAME",
        "-e",
        "JIRA_API_TOKEN",
        "ghcr.io/sooperset/mcp-atlassian:latest"
      ],
      "env": {
        "CONFLUENCE_URL": "https://f8a.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "long.tran@f8a.io",
        "CONFLUENCE_API_TOKEN": "API_TOKEN",
        "JIRA_URL": "https://f8a.atlassian.net",
        "JIRA_USERNAME": "long.tran@f8a.io",
        "JIRA_API_TOKEN": "API_TOKEN"
      }
    }
  }
}
```

### With Intellij Github Copilot
Source: [intellij-github-copilot-mcp](https://github.blog/changelog/2025-05-19-agent-mode-and-mcp-support-for-copilot-in-jetbrains-eclipse-and-xcode-now-in-public-preview/#set-up-your-local-mcp-servers)

In JetBrains IDEs: Click the GitHub Copilot icon -> Edit settings -> find the MCP Servers section.

![img.png](https://raw.githubusercontent.com/TikTzuki/TikTzuki/refs/heads/master/assets/images/intellij-mcp.gif)

Configuration mcp.json examples
```json
{
    "servers": {
        "mcp-atlassian": {
            "command": "docker",
            "args": [
                "run",
                "-i",
                "--rm",
                "-e", "CONFLUENCE_URL",
                "-e", "CONFLUENCE_USERNAME",
                "-e", "CONFLUENCE_API_TOKEN",
                "-e", "JIRA_URL",
                "-e", "JIRA_USERNAME",
                "-e", "JIRA_API_TOKEN",
                "ghcr.io/sooperset/mcp-atlassian:latest"
            ],
            "env": {
                "CONFLUENCE_URL": "https://f8a.atlassian.net/wiki",
                "CONFLUENCE_USERNAME": "long.tran@f8a.io",
                "CONFLUENCE_API_TOKEN": "API_TOKEN",
                "JIRA_URL": "https://f8a.atlassian.net",
                "JIRA_USERNAME": "long.tran@f8a.io",
                "JIRA_API_TOKEN": "API_TOKEN"
            }
        }
    }
}
```

## Log work magically

```
Log work for issues CEX-149, CEX-150, CEX-151, CEX-145, CEX-219 
across date range August 18-22
distributing 8 hours per day across the issues.
Date format is yyyy-MM-dd'T'HH:mm:ss.SSSZ
```