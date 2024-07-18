FROM alpine:3.14

# 安装必要的依赖
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    wget \
    unzip \
    python3 \
    py3-pip \
    libgcc \
    ca-certificates

# 手动安装 Solana CLI
RUN wget https://github.com/solana-labs/solana/releases/download/v1.14.7/solana-release-x86_64-unknown-linux-gnu.tar.bz2 && \
    tar -xjf solana-release-x86_64-unknown-linux-gnu.tar.bz2 && \
    mv solana-release /opt/solana && \
    ln -s /opt/solana/bin/solana /usr/local/bin/solana && \
    ln -s /opt/solana/bin/solana-keygen /usr/local/bin/solana-keygen && \
    rm solana-release-x86_64-unknown-linux-gnu.tar.bz2

# 设置环境变量
ENV PATH="/usr/local/bin:/opt/solana/bin:$PATH"

# 复制脚本到容器
COPY solana_mint.sh /app/solana_mint.sh

# 设置工作目录
WORKDIR /app

# 设置执行权限
RUN chmod +x solana_mint.sh

# 添加调试信息
RUN echo "PATH=$PATH" >> /etc/environment && \
    echo "which solana: $(which solana)" && \
    echo "which solana-keygen: $(which solana-keygen)"

# 设置入口点
ENTRYPOINT ["/bin/bash", "-c", "source /etc/environment && /app/solana_mint.sh"]