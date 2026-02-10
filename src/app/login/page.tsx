export const runtime = 'edge';
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'

export default async function LoginPage(props: {
    searchParams: Promise<{ error: string }>
}) {
    const searchParams = await props.searchParams;
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-md shadow-lg border-none">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-inner">
                            <LayoutDashboard className="size-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Orbit ERP</CardTitle>
                    <CardDescription>
                        Enter your email and password to access your workspace
                    </CardDescription>
                </CardHeader>
                <form>
                    <CardContent className="space-y-4">
                        {searchParams.error && (
                            <div className="p-3 text-sm font-medium text-rose-600 bg-rose-50 rounded-md border border-rose-100">
                                {searchParams.error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email text-sm font-semibold">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                required
                                className="h-11 focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password text-sm font-semibold">Password</Label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="h-11 focus-visible:ring-primary"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button formAction={login} className="w-full h-11 text-base font-semibold shadow-md active:scale-[0.98] transition-all">
                            Sign In
                        </Button>
                        <Button formAction={signup} variant="outline" className="w-full h-11 text-base font-medium">
                            Create local account
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2 px-8">
                            Orbit ERP is a high-performance business management system.
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
