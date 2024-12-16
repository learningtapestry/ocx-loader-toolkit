import prisma from "@/prisma";
import { MainLayout } from "@premieroctet/next-admin";
import { getMainLayoutProps } from "@premieroctet/next-admin/appRouter";
import { options } from "../options";

import { Metadata } from "next";

import { invoke } from "../../blitz-server"
import getCurrentUser from "../../(admin)/users/queries/getCurrentUser";

export const metadata: Metadata = {
  title: "Bundles",
  description: "List of bundles",
};

export default async function Page() {
  const mainLayoutProps = getMainLayoutProps({
    basePath: "/admin",
    apiBasePath: "/api/admin",
    options,
  });

  const currentUser = await invoke(getCurrentUser, null);

  const stats = [
    { name: "Total Users", stat: prisma.user.count() },
    { name: "Total Bundles", stat: prisma.bundle.count() },
  ];

  return (
    <MainLayout
      {...mainLayoutProps}
      user={{
        data: {
          name: currentUser?.name as string,
        },
        logout: ["/"],
      }}
    >
      <div className="p-10">
        <h1 className="mb-4 text-xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-gray-300">
          Dashboard
        </h1>
        <div className="mt-2">
          <div>
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.name}
                  className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 dark:bg-gray-800"
                >
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.name}
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
                    {item.stat}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
