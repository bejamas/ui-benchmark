import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PricingTabs() {
  return (
    <Tabs defaultValue="monthly" className="mx-auto max-w-3xl">
      <TabsList className="mx-auto grid w-[240px] grid-cols-2">
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="yearly">Yearly</TabsTrigger>
      </TabsList>

      <TabsContent value="monthly" className="mt-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Starter</CardTitle>
              <CardDescription>For personal projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                $0<span className="text-sm font-normal">/mo</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Get started
              </Button>
            </CardFooter>
          </Card>
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pro</CardTitle>
                <Badge>Popular</Badge>
              </div>
              <CardDescription>For growing teams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                $29<span className="text-sm font-normal">/mo</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Get started</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For large organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">Custom</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Contact sales
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="yearly" className="mt-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Starter</CardTitle>
              <CardDescription>For personal projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                $0<span className="text-sm font-normal">/yr</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Get started
              </Button>
            </CardFooter>
          </Card>
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pro</CardTitle>
                <Badge>Save 20%</Badge>
              </div>
              <CardDescription>For growing teams</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                $278<span className="text-sm font-normal">/yr</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Get started</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For large organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">Custom</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Contact sales
              </Button>
            </CardFooter>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
