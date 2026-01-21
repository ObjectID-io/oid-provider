export type ObjectData = {
  fields: {
    id: string;
    description: string;
    creation_date: string;
    document_url?: string;
    product_url: string;
    product_img_url: string;
    geolocation: string;
    object_type: string;
    object_did: string;
    creator_did: string;
    owner_did: string;
    agent_did: string;
    immutable_metadata: string;
    mutable_metadata: string;
    op_code: string;
    last_update: string;
  };
  type: string;
  id: string;
  network: string;
};
