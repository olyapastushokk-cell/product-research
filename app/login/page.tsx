import { SectionHeading } from "@/components/section-heading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md pt-4 sm:pt-10">
      <Card>
        <CardHeader>
          <SectionHeading className="mb-0">Вхід</SectionHeading>
        </CardHeader>
        <CardContent>
          <LoginForm next={next ?? "/"} />
        </CardContent>
      </Card>
    </div>
  );
}
