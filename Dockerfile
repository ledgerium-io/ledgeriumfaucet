FROM mhart/alpine-node:8

RUN apk add --no-cache --virtual .build-deps \
        git \
        bash \
        vim \
        python \
        make \
        g++

RUN mkdir -p /ledgerium
WORKDIR /ledgerium

COPY package.json /ledgerium/

RUN npm install

COPY . /ledgerium/

#RUN mkdir -p /ledgerium \
#    && cd /ledgerium \
#    && git clone -b LB-240 https://github.com/ledgerium/ledgeriumfaucet.git

# to be removed in the future
#WORKDIR /ledgerium/ledgeriumfaucet/
#RUN npm install

ENTRYPOINT ["tail", "-f", "/dev/null"]