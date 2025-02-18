// @ts-nocheck
/** @jsxImportSource theme-ui */

import { useState, useCallback } from 'react'
import { Button, Flex, Box, Text } from 'theme-ui'
import { utils } from 'near-api-js'
import { useRouter } from 'next/router'
import Layout from '../../../containers/Layout'
import { CreatorShare, Bidders, MediaObject } from '@cura/components'
import { alertMessageState, indexLoaderState } from '../../../state/recoil'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { useNFTContract, useNFTMethod, useMarketMethod } from '@cura/hooks'
import { accountState } from 'state/account'
import { getFrameWidth } from 'utils/frame-width'
import { useStatusUpdate } from 'utils/hooks-helpers'
const CONTRACT_BURN_GAS = utils.format.parseNearAmount('0.00000000029') // 290 Tgas
const MARKET_ACCEPT_BID_GAS = utils.format.parseNearAmount('0.00000000025') // 250 Tgas
const YOCTO_NEAR = utils.format.parseNearAmount('0.000000000000000000000001')

const HARDCODED_ROYALTY_ADDRESS = process.env.YSN_ADDRESS
const HARDCODED_ROYALTY_SHARE = '2500'

const MLProject = ({}) => {
    const router = useRouter()

    const { updateStatus } = useStatusUpdate()

    const setAlertMessage = useSetRecoilState(alertMessageState)
    const setIndexLoader = useSetRecoilState(indexLoaderState)

    const project = `ml/${router.query.project}`
    const { contract } = useNFTContract(
        `ml${router.query.project}.ysn-1_0_0.ysn.testnet`
    )

    const { data: media } = useNFTMethod(
        `ml${router.query.project}.ysn-1_0_0.ysn.testnet`,
        'nft_token',
        {
            token_id: router.query.id,
            limit: 2,
        },
        null,
        updateStatus
    )

    const { data: bids } = useMarketMethod(
        `market.ml${router.query.project}.ysn-1_0_0.ysn.testnet`,
        'get_bids',
        {
            token_id: media?.id,
        }
    )

    async function acceptBid(bidder: string) {
        setIndexLoader(true)
        try {
            await contract.accept_bid(
                {
                    token_id: media?.id,
                    bidder: bidder,
                },
                MARKET_ACCEPT_BID_GAS,
                YOCTO_NEAR
            )
        } catch (e) {
            setIndexLoader(false)
            setAlertMessage(e.toString())
        }
    }

    async function burnDesign() {
        setIndexLoader(true)
        try {
            await contract.burn_design(
                {
                    token_id: router.query.id,
                },
                CONTRACT_BURN_GAS,
                YOCTO_NEAR
            )
        } catch (e) {
            setIndexLoader(false)
            setAlertMessage(e.toString())
        }
    }

    const frameDimension = getFrameWidth()

    return (
        <Layout project={project}>
            <>
                <div
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 3,
                    }}
                >
                    <Button onClick={burnDesign} variant="red">
                        Burn
                    </Button>
                </div>
                <div
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    {media && (
                        <MediaObject
                            mediaURI={`https://arweave.net/${media.metadata.media}`}
                            width={frameDimension}
                            height={frameDimension}
                        />
                    )}
                </div>
                <div
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 3,
                    }}
                >
                    <a
                        sx={{ textDecoration: 'none' }}
                        href={`https://viewblock.io/arweave/tx/${media?.metadata.media}`}
                    >
                        <Text
                            sx={{
                                fontSize: 2,
                            }}
                        >
                            Arweave ↗
                        </Text>
                    </a>
                </div>
                {bids && (
                    <div
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mt: 3,
                        }}
                    >
                        <Bidders bidders={bids} onAcceptBid={acceptBid} />
                    </div>
                )}
                <div
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 3,
                    }}
                >
                    <CreatorShare
                        address={HARDCODED_ROYALTY_ADDRESS}
                        share={HARDCODED_ROYALTY_SHARE}
                    />
                </div>
            </>
        </Layout>
    )
}

export default MLProject
