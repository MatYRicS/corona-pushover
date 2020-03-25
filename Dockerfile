FROM node:13

RUN mkdir -p /home/covid
WORKDIR /home/covid

COPY . /home/covid
RUN npm i

CMD [ "node", "app.js" ]