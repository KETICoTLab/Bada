FROM node:14

ENV HOME=/home/bada
WORKDIR $HOME

COPY package.json ./
RUN npm install
COPY . ./
EXPOSE 7576