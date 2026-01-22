import type { IotaClient } from "@iota/iota-sdk/client";

/**
 * Fetch all owned objectIds for a specific Move type.
 *
 * Uses the RPC ownedObjects listing and matches either the top-level `data.type`
 * or `data.content.type`.
 */
export async function getOwnedObjectIdsByType(
  client: IotaClient,
  owner: string,
  targetType: string
): Promise<string[]> {
  const found: string[] = [];
  let cursor: string | null = null;

  for (;;) {
    const page = await client.getOwnedObjects({
      owner,
      cursor,
      options: { showType: true, showContent: true },
    });

    const items = page?.data ?? [];
    for (const item of items) {
      const objId = item.data?.objectId;
      if (!objId) continue;

      const directType = item.data?.type;
      if (directType && directType === targetType) {
        found.push(objId);
        continue;
      }

      const content = item.data?.content as any;
      const contentType = content?.type as string | undefined;
      if (contentType && contentType === targetType) {
        found.push(objId);
      }
    }

    if (!page?.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return found;
}
