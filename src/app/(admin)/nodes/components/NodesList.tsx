"use client";
import { usePaginatedQuery } from "@blitzjs/rpc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import getNodes from "../queries/getNodes";
import { useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { Route } from "next";
import { Prisma } from ".prisma/client"

const ITEMS_PER_PAGE = 100;

export const NodesList = () => {
  const searchparams = useSearchParams()!;
  const page = Number(searchparams.get("page")) || 0;
  const [{ nodes, hasMore }] = usePaginatedQuery(getNodes, {
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  });
  const router = useRouter();
  const pathname = usePathname();

  const goToPreviousPage = () => {
    const params = new URLSearchParams(searchparams);
    params.set("page", (page - 1).toString());
    router.push((pathname + "?" + params.toString()) as Route);
  };
  const goToNextPage = () => {
    const params = new URLSearchParams(searchparams);
    params.set("page", (page + 1).toString());
    router.push((pathname + "?" + params.toString()) as Route);
  };

  return (
    <div>
      <ul>
        {nodes.map((node) => (
          <li key={node.id}>
            <Link href={`/nodes/${node.id}`}>{(node.metadata as Prisma.JsonObject).name as string}</Link>
          </li>
        ))}
      </ul>

      <button disabled={page === 0} onClick={goToPreviousPage}>
        Previous
      </button>
      <button disabled={!hasMore} onClick={goToNextPage}>
        Next
      </button>
    </div>
  );
};
