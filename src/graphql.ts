import type { ObjectEdge } from "./types";

export async function searchObjectsByType(type: string, after: string | null, graphqlProvider: string): Promise<ObjectEdge[]> {
  const query = `
  query ($type: String!, $after: String) {
    objects(filter: { type: $type }, after: $after) {
      edges {
        cursor
        node {
          address
          asMoveObject {
            contents {
              type { repr }
              data
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }`;

  const resp = await fetch(graphqlProvider, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { type, after } }),
  });

  const json = await resp.json();
  if (!resp.ok) throw Object.assign(new Error(`GraphQL HTTP ${resp.status}`), { status: resp.status, json });
  if (json.errors) throw Object.assign(new Error("GraphQL errors"), { errors: json.errors });

  const edges = json?.data?.objects?.edges;
  if (!edges) throw new Error("No data returned from the GraphQL query.");
  return edges as ObjectEdge[];
}
