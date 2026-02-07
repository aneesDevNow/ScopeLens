import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuccessPage() {
    return (
        <div className="p-6 flex items-center justify-center min-h-[80vh]">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                    </div>
                    <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                    <CardDescription>Thank you for upgrading to Pro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Order #</div>
                        <div className="font-mono font-semibold">SL-2024-001234</div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Plan</span>
                            <span className="font-medium">Pro Plan</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-medium">$20.90</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Billing</span>
                            <span className="font-medium">February 15, 2024</span>
                        </div>
                    </div>
                    <div className="space-y-3 pt-4">
                        <Link href="/">
                            <Button className="w-full">
                                <span className="material-symbols-outlined mr-2">cloud_upload</span>
                                Start Scanning
                            </Button>
                        </Link>
                        <Link href="/plans">
                            <Button variant="outline" className="w-full">View Subscription</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
