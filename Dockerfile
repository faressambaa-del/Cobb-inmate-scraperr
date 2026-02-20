FROM apify/actor-node-playwright-chrome:18

COPY package*.json ./

RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "npm install finished"

COPY . ./

CMD npm start
