import LoginClient from './LoginClient';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = first(params.next) || '/super-admin';
  const configError = first(params.error);

  return <LoginClient nextPath={nextPath} configError={configError} />;
}
