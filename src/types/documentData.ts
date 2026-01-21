export type DocumentData = {
  fields: {
    id: string;
    creator_did: string;
    editors_dids: string[];
    approvers_dids: string[];
    publisher_did: string;
    owner_did: string;
    approval_flags: number[];
    description: string;
    status: number;
    hash: string;
    creation_date: string;
    document_url: string;
    credit: number;
    immutable_metadata: string;
    mutable_metadata: string;
    last_update: string;
    change_log: string[];
  };

  type: string;
  id: string;
  network: string;
};
