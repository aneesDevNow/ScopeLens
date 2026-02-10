import { NextResponse } from "next/server";

// Hardcoded PK banks with account details
// Can be moved to a database table later for dynamic management
const PK_BANKS = [
    {
        id: "meezan",
        name: "Meezan Bank",
        accountTitle: "ScopeLens LLC",
        accountNumber: "PK00MEZN00000000000000",
    },
];

export async function GET() {
    return NextResponse.json({ banks: PK_BANKS });
}
