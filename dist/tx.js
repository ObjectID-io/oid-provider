/**
 * Browser-safe Uint8Array -> base64 encoding (no Buffer).
 */
function u8ToB64(u8) {
    let s = "";
    const chunk = 0x8000;
    for (let i = 0; i < u8.length; i += chunk) {
        s += String.fromCharCode(...u8.subarray(i, i + chunk));
    }
    return btoa(s);
}
async function postJson(url, token, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body ?? {}),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok)
        throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, data });
    return data;
}
async function reserveGas(gasBudget, gasStationUrl, gasStationToken) {
    const resp = await postJson(`${gasStationUrl}/v1/reserve_gas`, gasStationToken, {
        gas_budget: gasBudget,
        reserve_duration_secs: 10,
    });
    return resp?.result;
}
async function sponsorSignAndSubmit(reservationId, txBytes, userSig, gasStationUrl, gasStationToken) {
    const resp = await postJson(`${gasStationUrl}/v1/execute_tx`, gasStationToken, {
        reservation_id: reservationId,
        tx_bytes: u8ToB64(txBytes),
        user_sig: userSig,
    });
    return resp?.effects;
}
async function attemptWithGasStation(network, client, keyPair, tx, gasBudget, gasStationUrl, gasStationToken) {
    const reserved = await reserveGas(gasBudget, gasStationUrl, gasStationToken);
    tx.setSender(keyPair.toIotaAddress());
    tx.setGasOwner(reserved.sponsor_address);
    tx.setGasPayment(reserved.gas_coins);
    tx.setGasBudget(gasBudget);
    const unsignedTxBytes = await tx.build({ client });
    const signedTx = await keyPair.signTransaction(unsignedTxBytes);
    const userSig = signedTx.signature;
    const effects = await sponsorSignAndSubmit(reserved.reservation_id, unsignedTxBytes, userSig, gasStationUrl, gasStationToken);
    return {
        digest: effects.transactionDigest,
        effects,
    };
}
/**
 * Signs and executes a transaction.
 * - If useGasStation=true, tries gasStation1 then gasStation2 (if provided).
 * - If useGasStation=false, executes directly with user's gas.
 */
export async function signAndExecute(client, keyPair, tx, opts) {
    try {
        if (opts.useGasStation) {
            const gs = opts.gasStation;
            if (!gs?.gasStation1URL || !gs?.gasStation1Token) {
                throw new Error("useGasStation=true but gasStation config is missing.");
            }
            try {
                const txEffect = await attemptWithGasStation(opts.network, client, keyPair, tx, opts.gasBudget, gs.gasStation1URL, gs.gasStation1Token);
                const status = txEffect.effects?.status;
                const ok = status?.status === "success";
                return {
                    success: !!ok,
                    txDigest: txEffect.digest,
                    status,
                    error: ok ? undefined : status?.error,
                    txEffect,
                };
            }
            catch (e1) {
                if (gs.gasStation2URL && gs.gasStation2Token) {
                    const txEffect = await attemptWithGasStation(opts.network, client, keyPair, tx, opts.gasBudget, gs.gasStation2URL, gs.gasStation2Token);
                    const status = txEffect.effects?.status;
                    const ok = status?.status === "success";
                    return {
                        success: !!ok,
                        txDigest: txEffect.digest,
                        status,
                        error: ok ? undefined : status?.error,
                        txEffect,
                    };
                }
                throw e1;
            }
        }
        // Direct execution (user pays gas)
        const result = await client.signAndExecuteTransaction({
            signer: keyPair,
            transaction: tx,
        });
        const txEffect = await client.waitForTransaction({
            digest: result.digest,
            options: { showEffects: true },
        });
        const status = txEffect.effects?.status;
        const ok = status?.status === "success";
        return {
            success: !!ok,
            txDigest: txEffect.digest,
            status,
            error: ok ? undefined : status?.error,
            txEffect,
        };
    }
    catch (error) {
        return { success: false, error };
    }
}
//# sourceMappingURL=tx.js.map