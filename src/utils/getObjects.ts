import type { PaginatedObjectsResponse, IotaObjectData, IotaClient } from "@iota/iota-sdk/client";
import { IotaGraphQLClient, type GraphQLQueryResult } from "@iota/iota-sdk/graphql";
import { graphql } from "@iota/iota-sdk/graphql/schemas/2025.2";
import type { ObjectEdge } from "../types";

type ObjectContent = { type?: string };

/**
 * Returns all owned object IDs matching a specific Move type.
 * Paginates through the full owned-objects list for the owner (RPC).
 */
export async function getObjectIdsByType(client: IotaClient, owner: string, targetType: string): Promise<string[]> {
  const found: string[] = [];
  let cursor: string | null = null;

  for (;;) {
    const page: PaginatedObjectsResponse = await client.getOwnedObjects({
      owner,
      cursor,
      options: {
        showType: true,
        showContent: true, // fallback if .type is missing
      },
    });

    const items = page?.data ?? [];
    for (const item of items) {
      const objId = item.data?.objectId;
      if (!objId) continue;

      // Fast path
      if (item.data?.type === targetType) {
        found.push(objId);
        continue;
      }

      // Fallback
      const content = item.data?.content as unknown as ObjectContent | undefined;
      if (content?.type === targetType) {
        found.push(objId);
      }
    }

    if (!page?.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return found;
}

/**
 * Fetches a single object by id (RPC).
 */
export async function getObject(client: IotaClient, id: string): Promise<IotaObjectData | null> {
  if (!id) return null;

  const { data } = await client.getObject({
    id,
    options: {
      showType: true,
      showOwner: false,
      showPreviousTransaction: false,
      showDisplay: true,
      showContent: true,
      showBcs: true,
      showStorageRebate: false,
    },
  });

  return (data as IotaObjectData) ?? null;
}

interface QueryResult {
  objects: {
    edges: ObjectEdge[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

/**
 * Searches Move objects by type AND owner using GraphQL endpoint.
 * Paginates until completion.
 */
export async function searchObjectsByTypeAndOwner(
  graphqlProvider: string,
  objectType: string,
  owner: string
): Promise<ObjectEdge[]> {
  const gqlClient = new IotaGraphQLClient({ url: graphqlProvider });

  const query = graphql(`
    query ObjectsByTypeAndOwner($type: String!, $after: String, $owner: IotaAddress) {
      objects(filter: { type: $type, owner: $owner }, first: 50, after: $after) {
        edges {
          node {
            address
            asMoveObject {
              contents {
                type {
                  repr
                }
                data
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `);

  const edges: ObjectEdge[] = [];
  let after: string | null = null;

  try {
    for (;;) {
      const res: GraphQLQueryResult<QueryResult> = await gqlClient.query<QueryResult>({
        query,
        variables: { type: objectType, after, owner },
      });

      const page = res?.data?.objects;
      if (!page?.edges?.length) break;

      edges.push(...page.edges);

      if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor) break;
      after = page.pageInfo.endCursor;
    }
  } catch {
    return [];
  }

  return edges;
}
