console.log("initialised worker")

// we should only ever really receive one message,
// which contains our SharedArrayBuffer (SAB) which we use to
// receive messages in the future.
// The benefit of that is, that we can use Atomics.wait
// to block as long as someone isn't waking us up.
// To send messages out of the worker we can just use the
// normal `postMessage` to communicate to whoever called us.
//
// The SAB layout is really simple:
// - The first 4 bytes are just an int we're using as a canonical place to Atomics.wait for
// - The next 32 bytes are where we're going to receive the hash digest
onmessage = event => {
    const sab = event.data
    const sabBytes = new Uint8Array(sab)
    const sabInts = new Int32Array(sab)

    const sha256 = toBeHashed => {
        // Let the main thread run sha256
        postMessage(["sha256", toBeHashed])
        // wait, assuming the SAB's index 0 is 0 with a timeout of 1s
        const result = Atomics.wait(sabInts, 0, 0, 1000)
        if (result !== "ok") throw result
        // copy the hash out of the SAB
        const hash = new Uint8Array(32)
        hash.set(sabBytes.subarray(4, 4+32))
        return hash
    }

    // Look ma, no await!
    const hash = sha256(new Uint8Array([1, 2, 3, 4, 5, 6]))
    console.log("hash", hash)
}

