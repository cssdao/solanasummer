#!/bin/bash

# 添加调试信息
echo "Current PATH: $PATH"
echo "Solana location: $(which solana)"
echo "Solana-keygen location: $(which solana-keygen)"

# 设置环境变量
export RPC_URL="https://jupiter-fe.helius-rpc.com/"

# 检查参数
if [ $# -eq 0 ]; then
    NUM_WALLETS=50
else
    NUM_WALLETS=$1
fi

if ! [[ "$NUM_WALLETS" =~ ^[0-9]+$ ]]; then
    echo "Please provide a valid number of wallets to create."
    exit 1
fi

# 创建钱包
create_wallets() {
    for i in $(seq 1 $NUM_WALLETS); do
        if ! solana-keygen new --no-bip39-passphrase --silent | grep "\[" | cut -d '[' -f2 | cut -d ']' -f1 >> wallet.txt; then
            echo "Failed to create wallet $i"
        fi
    done
}

# 获取交易
get_tx() {
    local address=$1
    curl -s -X POST "https://proxy.dial.to/?url=https%3A%2F%2Fsolanasummer.click%2Fon%2Fmint" \
         -H "Content-Type: application/json" \
         -d "{\"account\":\"$address\"}" | jq -r '.transaction // empty'
}

# 发送交易
send_tx() {
    local private_key=$1
    local rawtx=$2
    
    echo "$rawtx" | base64 -d > tx.bin
    
    signature=$(solana transfer --from "$private_key" --blockhash $(solana get-latest-blockhash -u $RPC_URL | jq -r '.blockhash') --sign-only --fee-payer "$private_key" --signer tx.bin | grep "Signature:" | awk '{print $2}')
    
    if [ -n "$signature" ]; then
        solana confirm -v "$signature" -u $RPC_URL
        if [ $? -eq 0 ]; then
            sed -i "/$private_key/d" wallet.txt
            echo "$private_key" >> success.txt
            echo "Mint success: $signature"
        fi
    else
        echo "Failed to sign transaction"
    fi
    
    rm tx.bin
}

# 主函数
main() {
    create_wallets
    
    while read -r private_key; do
        address=$(solana-keygen pubkey "$private_key")
        while true; do
            tx_raw=$(get_tx "$address")
            if [ -n "$tx_raw" ]; then
                send_tx "$private_key" "$tx_raw"
                break
            fi
            sleep 1
        done
    done < wallet.txt
}

main