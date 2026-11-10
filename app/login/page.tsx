import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <>
      <h1>Вхід</h1>
      <LoginForm next={next ?? "/"} />
    </>
  );
}
