// src/app/(app)/wallet/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, ArrowUpRight, ArrowDownLeft, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const transactions = [
    {
        id: 'txn1',
        type: 'reward',
        description: 'Program Completion Reward: BSc in Software Development and Emerging Technologies',
        amount: '+ 100 AFTA',
        date: '2024-05-20',
    },
    {
        id: 'txn2',
        type: 'spend',
        description: 'Annual Tuition Fee 2024',
        amount: '- 250 AFTA',
        date: '2024-01-15',
    },
    {
        id: 'txn3',
        type: 'reward',
        description: 'Exam High Score: Intro to Algorithms',
        amount: '+ 50 AFTA',
        date: '2024-05-15',
    },
     {
        id: 'txn4',
        type: 'reward',
        description: 'Peer-to-Peer Tutoring Session',
        amount: '+ 25 AFTA',
        date: '2024-05-10',
    },
]

export default function WalletPage() {
    // A simple calculation to reflect the transactions
    const balance = transactions.reduce((acc, tx) => {
        const amount = parseFloat(tx.amount.replace(' AFTA', ''));
        return acc + amount;
    }, 1000); // Starting with a base balance for demo

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                <p className="text-muted-foreground">
                    View your AFTACOIN balance and transaction history.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardDescription>Total Balance</CardDescription>
                        <CardTitle className="text-4xl">{balance.toFixed(0)} AFTA</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Deposit</Button>
                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Withdraw</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium">{tx.description}</TableCell>
                                            <TableCell>
                                                 <Badge variant={tx.type === 'reward' ? 'default' : 'secondary'} className="capitalize">
                                                    {tx.type === 'reward' ? <ArrowDownLeft className="mr-1 h-3 w-3 text-green-400"/> : <ArrowUpRight className="mr-1 h-3 w-3 text-red-400"/>}
                                                    {tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${tx.type === 'reward' ? 'text-green-500' : 'text-destructive'}`}>{tx.amount}</TableCell>
                                            <TableCell>{tx.date}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
