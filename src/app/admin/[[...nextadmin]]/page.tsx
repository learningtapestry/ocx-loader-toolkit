
import prisma from "@/prisma";
import { NextAdmin, PromisePageProps } from "@premieroctet/next-admin";
import { getNextAdminProps } from "@premieroctet/next-admin/appRouter";
import { Metadata, Viewport } from "next";
import { options } from "@/src/app/admin/options";

import { invoke } from "../../blitz-server"
import getCurrentUser from "../../(admin)/users/queries/getCurrentUser";

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

export const metadata: Metadata = {
  icons: "/assets/logo.svg",
};

export default async function AdminPage(props: PromisePageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const nextAdminProps = await getNextAdminProps({
    params: params.nextadmin,
    searchParams,
    basePath: "/admin",
    apiBasePath: "/api/admin",
    prisma,
    options,
    locale: params.locale as string,
  });

  const logoutRequest: [RequestInfo, RequestInit] = [
    "/",
    {
      method: "POST",
    },
  ];

  const currentUser = await invoke(getCurrentUser, null);

  return (
    <NextAdmin
      {...nextAdminProps}
      user={{
        data: {
          name: currentUser?.name as string,
        },
        logout: logoutRequest,
      }}
    />
  );
}