# Solana Summer Blink

## Using this example

安装依赖

```sh
yarn install
```

批量创建钱包执行脚本，100 代表你要创建的钱包地址数，可以是任意数量

```sh
yarn start 100
```

执行完脚本如果 mint 成功，就会把成功的地址归集到 success.txt 文件中

## Useful Links

Learn more about :

- [Twitter](https://x.com/SolanaSummerBL)
- [Website](https://dial.to/?action=solana-action:https://launchmynft.io/api/actions/FLrFig2wJnvDw59QMKYnakA5M6v7xGPXCBy6ZXTKYve/fNhoIIyK8Bs5FuMMU7eu)


## 运行 Docker 容器 - 内部测试，还有 bug

```sh
docker run -it --rm \
    -v $(pwd)/wallet.txt:/app/wallet.txt \
    -v $(pwd)/success.txt:/app/success.txt \
    cssshow/solanasummer 100
```