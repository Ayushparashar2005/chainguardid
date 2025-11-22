# ChainGuard ID

**Blockchain-Based Identity Verification for Networks**

ChainGuard ID is a robust security dashboard that demonstrates the use of blockchain technology for immutable network access logging, combined with AI-driven threat detection.

## Key Features

*   **Immutable Audit Log**: Uses a blockchain structure to store access logs, ensuring that history cannot be altered or tampered with.
*   **Prevent Unauthorized Access**: 
    *   **Active Firewall**: Administrators can instantly block suspicious IP addresses directly from the live feed.
    *   **Identity Verification**: A portal that checks both user credentials and firewall rules before granting access.
*   **AI Threat Analysis**: Integrates Google's Gemini 2.5 Flash model to analyze the blockchain ledger for anomalies, brute-force attacks, and suspicious patterns.
*   **Real-time Visualization**: Visualizes the blockchain generation process (mining) and network traffic statistics.

## How to Use

1.  **Simulate Traffic**: Click the **"Simulate Traffic"** button in the top right to generate network events.
2.  **Block an IP**: In the **Dashboard** view, look at the "Live Access Control Feed". Click the **Ban Icon** next to any IP address to add it to the firewall blacklist.
    *   *Tip:* Look for `192.168.1.100` (The Portal IP) and block it to test the prevention system.
3.  **Verify Identity**: Switch to the **Identity Portal** tab.
    *   Enter a User ID (e.g., `sys_admin_01` or `guest_user_a`).
    *   Click **Verify**.
    *   If the simulated IP (`192.168.1.100`) is blocked, access will be denied regardless of the user's role.
4.  **Analyze Security**: Switch to the **AI Threat Analysis** tab and click "Run Security Audit" to get a report on recent network activity.

## Tech Stack

*   **Frontend**: React, Tailwind CSS, Lucide Icons
*   **Visualization**: Recharts
*   **AI**: Google GenAI SDK (Gemini 2.5 Flash)
*   **Core**: TypeScript, SHA-256 Crypto API

***

*Note: This application is a simulation designed for educational and demonstration purposes.*
