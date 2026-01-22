import type { ObjectEdge } from "../types/types";

async function fetchEdges(
  graphqlProvider: string,
  query: string,
  variables: Record<string, any>
): Promise<{ edges: ObjectEdge[]; endCursor: string | null; hasNext: boolean }> {
  const resp = await fetch(graphqlProvider, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await resp.json().catch(() => null)) as any;
  if (!resp.ok) throw Object.assign(new Error(`GraphQL HTTP ${resp.status}`), { status: resp.status, json });
  if (json?.errors) throw Object.assign(new Error("GraphQL errors"), { errors: json.errors });

  const page = json?.data?.objects;
  const pageEdges = (page?.edges as ObjectEdge[] | undefined) ?? [];
  const hasNext = !!page?.pageInfo?.hasNextPage;
  const endCursor = (page?.pageInfo?.endCursor ?? null) as string | null;

  return { edges: pageEdges, endCursor, hasNext };
}

async function graphqlAll(
  graphqlProvider: string,
  query: string,
  makeVariables: (after: string | null) => Record<string, any>
): Promise<ObjectEdge[]> {
  const edges: ObjectEdge[] = [];
  let after: string | null = null;

  for (;;) {
    const page = await fetchEdges(graphqlProvider, query, makeVariables(after));
    if (page.edges.length) edges.push(...page.edges);

    if (!page.hasNext || !page.endCursor) break;
    after = page.endCursor;
  }

  return edges;
}

export async function graphqlAllByType(graphqlProvider: string, type: string): Promise<ObjectEdge[]> {
  const query = `
    query ($type: String!, $after: String) {
      objects(filter: { type: $type }, first: 50, after: $after) {
        edges {
          cursor
          node {
            address
            asMoveObject {
              contents { type { repr } data }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  return graphqlAll(graphqlProvider, query, (after) => ({ type, after }));
}

export async function graphqlAllByTypeAndOwner(
  graphqlProvider: string,
  type: string,
  owner: string
): Promise<ObjectEdge[]> {
  const query = `
    query ($type: String!, $after: String, $owner: IotaAddress) {
      objects(filter: { type: $type, owner: $owner }, first: 50, after: $after) {
        edges {
          cursor
          node {
            address
            asMoveObject {
              contents { type { repr } data }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  return graphqlAll(graphqlProvider, query, (after) => ({ type, after, owner }));
}
