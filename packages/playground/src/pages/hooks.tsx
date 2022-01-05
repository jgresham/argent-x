import { useStarkNet, useTransactionStatus } from "@argent/use-starknet"
import { NextPage } from "next"
import { FC, useState } from "react"
import { compileCalldata, number, Provider, stark, uint256 } from "starknet"

import { erc20TokenAddressByNetwork } from "../services/token.service"

const determineNetworkSlug = (baseUrl: string) =>
  baseUrl.includes("alpha-mainnet.starknet.io")
    ? "mainnet-alpha"
    : "goerli-alpha"

const Transaction: FC<{
  transactionHash: string
  provider: Provider
}> = ({ transactionHash, provider }) => {
  const transactionStatus = useTransactionStatus(provider, transactionHash)

  return (
    <div
      style={{
        backgroundColor: "#4f4f4f",
        padding: "1rem",
        marginBottom: "1rem",
        borderRadius: "0.5rem",
      }}
    >
      <h3>Transaction</h3>
      <p>
        <code>{transactionHash}</code>
      </p>
      <p>Status:</p>
      <p>
        <code>{transactionStatus}</code>
      </p>
    </div>
  )
}

const SecondConsumer: FC = () => {
  const sn = useStarkNet({ showModal: true })

  return sn.isConnected ? (
    <div
      style={{
        padding: "3em 5em",
        margin: "3em 5em",
        backgroundColor: "#4f4f4f",
      }}
    >
      <>
        <h1>2nd Consumer</h1>
        <h3>
          Wallet address: <code>{sn.selectedAddress}</code>
        </h3>
        <h3>
          Network: <code>{sn.provider.baseUrl}</code>
        </h3>
      </>
    </div>
  ) : null
}

const Hooks: NextPage = () => {
  const sn = useStarkNet({ showModal: true })
  const [transactions, setTransactions] = useState<string[]>([])

  console.log("rerender")

  return (
    <div style={{ padding: "3em 5em" }}>
      <h1>Hooks</h1>
      {sn.isConnected ? (
        <>
          <h3>
            Wallet address: <code>{sn.selectedAddress}</code>
          </h3>
          <h3>
            Network: <code>{sn.provider.baseUrl}</code>
          </h3>

          <button
            onClick={async () => {
              try {
                const tokenAddress =
                  erc20TokenAddressByNetwork[
                    determineNetworkSlug(sn.provider.baseUrl)
                  ]

                const transaction = await sn.signer.invokeFunction(
                  tokenAddress,
                  stark.getSelectorFromName("mint"),
                  compileCalldata({
                    to: sn.selectedAddress,
                    value: {
                      type: "struct",
                      ...uint256.bnToUint256(
                        number.toBN(
                          "0x3635c9adc5dea00000", // = 1000 * 10 ** 18
                        ),
                      ),
                    },
                  }),
                )

                setTransactions((txs) => [...txs, transaction.transaction_hash])
              } catch (e) {
                console.error(e)
              }
            }}
          >
            Mint
          </button>
          {transactions.length > 0 && <h2>Transactions:</h2>}
          {transactions.map((transactionHash) => (
            <Transaction
              key={transactionHash}
              transactionHash={transactionHash}
              provider={sn.provider}
            />
          ))}
        </>
      ) : (
        <button onClick={() => sn.enable()}>Connect Wallet</button>
      )}

      <SecondConsumer />
    </div>
  )
}

export default Hooks
