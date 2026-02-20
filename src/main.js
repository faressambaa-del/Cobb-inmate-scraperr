2026-02-20T13:34:36.399Z ACTOR: Pulling container image of build OwnBzsfwgv6OOOO56 from registry.
2026-02-20T13:34:37.050Z ACTOR: Creating container.
2026-02-20T13:34:37.089Z ACTOR: Starting container.
2026-02-20T13:34:37.327Z Will run command: xvfb-run -a -s "-ac -screen 0 1920x1080x24+32 -nolisten tcp" /bin/sh -c npm start
2026-02-20T13:34:37.561Z
2026-02-20T13:34:37.562Z > cobb-inmate-scraper@1.0.0 start
2026-02-20T13:34:37.563Z > node src/main.js
2026-02-20T13:34:37.564Z
2026-02-20T13:34:38.133Z [baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
2026-02-20T13:34:39.417Z INFO  System info {"apifyVersion":"3.5.2","apifyClientVersion":"2.20.0","crawleeVersion":"3.15.3","osType":"Linux","nodeVersion":"v18.20.8"}
2026-02-20T13:34:40.495Z INFO  PlaywrightCrawler: Starting the crawler.
2026-02-20T13:34:43.374Z Opening search page
2026-02-20T13:34:44.088Z SOID: IN JAIL
2026-02-20T13:35:14.099Z WARN  PlaywrightCrawler: Reclaiming failed request back to the list or queue. page.waitForNavigation: Timeout 30000ms exceeded.
2026-02-20T13:35:14.100Z =========================== logs ===========================
2026-02-20T13:35:14.102Z waiting for navigation until "load"
2026-02-20T13:35:14.102Z ============================================================
2026-02-20T13:35:14.103Z     at PlaywrightCrawler.requestHandler (/home/myuser/src/main.js:35:18) {"id":"xSL1PnBZ7HHX1Ae","url":"http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=RANKIN%20SHAWN%20&serial=&qry=inCustody","retryCount":1}
2026-02-20T13:35:16.175Z Opening search page
2026-02-20T13:35:17.686Z SOID: IN JAIL
2026-02-20T13:35:40.494Z INFO  PlaywrightCrawler:Statistics: PlaywrightCrawler request statistics: {"requestAvgFailedDurationMillis":null,"requestAvgFinishedDurationMillis":null,"requestsFinishedPerMinute":0,"requestsFailedPerMinute":0,"requestTotalDurationMillis":0,"requestsTotal":0,"crawlerRuntimeMillis":60387,"retryHistogram":[]}
2026-02-20T13:35:40.502Z INFO  PlaywrightCrawler:AutoscaledPool: state {"currentConcurrency":1,"desiredConcurrency":3,"systemStatus":{"isSystemIdle":true,"memInfo":{"isOverloaded":false,"limitRatio":0.2,"actualRatio":0},"eventLoopInfo":{"isOverloaded":false,"limitRatio":0.6,"actualRatio":0.02},"cpuInfo":{"isOverloaded":false,"limitRatio":0.4,"actualRatio":0.079},"clientInfo":{"isOverloaded":false,"limitRatio":0.3,"actualRatio":0}}}
2026-02-20T13:35:47.688Z WARN  PlaywrightCrawler: Reclaiming failed request back to the list or queue. page.waitForNavigation: Timeout 30000ms exceeded.
2026-02-20T13:35:47.689Z =========================== logs ===========================
2026-02-20T13:35:47.690Z waiting for navigation until "load"
2026-02-20T13:35:47.690Z ============================================================
2026-02-20T13:35:47.691Z     at PlaywrightCrawler.requestHandler (/home/myuser/src/main.js:35:18) {"id":"xSL1PnBZ7HHX1Ae","url":"http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=RANKIN%20SHAWN%20&serial=&qry=inCustody","retryCount":2}
2026-02-20T13:35:49.674Z Opening search page
2026-02-20T13:35:51.078Z SOID: IN JAIL
2026-02-20T13:36:21.081Z WARN  PlaywrightCrawler: Reclaiming failed request back to the list or queue. page.waitForNavigation: Timeout 30000ms exceeded.
2026-02-20T13:36:21.081Z =========================== logs ===========================
2026-02-20T13:36:21.082Z waiting for navigation until "load"
2026-02-20T13:36:21.083Z ============================================================
2026-02-20T13:36:21.083Z     at PlaywrightCrawler.requestHandler (/home/myuser/src/main.js:35:18) {"id":"xSL1PnBZ7HHX1Ae","url":"http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=RANKIN%20SHAWN%20&serial=&qry=inCustody","retryCount":3}
2026-02-20T13:36:27.075Z Opening search page
2026-02-20T13:36:28.480Z SOID: IN JAIL
2026-02-20T13:36:40.495Z INFO  PlaywrightCrawler:Statistics: PlaywrightCrawler request statistics: {"requestAvgFailedDurationMillis":null,"requestAvgFinishedDurationMillis":null,"requestsFinishedPerMinute":0,"requestsFailedPerMinute":0,"requestTotalDurationMillis":0,"requestsTotal":0,"crawlerRuntimeMillis":120386,"retryHistogram":[]}
2026-02-20T13:36:40.577Z INFO  PlaywrightCrawler:AutoscaledPool: state {"currentConcurrency":1,"desiredConcurrency":3,"systemStatus":{"isSystemIdle":true,"memInfo":{"isOverloaded":false,"limitRatio":0.2,"actualRatio":0},"eventLoopInfo":{"isOverloaded":false,"limitRatio":0.6,"actualRatio":0.063},"cpuInfo":{"isOverloaded":false,"limitRatio":0.4,"actualRatio":0.193},"clientInfo":{"isOverloaded":false,"limitRatio":0.3,"actualRatio":0}}}
2026-02-20T13:36:58.519Z ERROR PlaywrightCrawler: Request failed and reached maximum retries. page.waitForNavigation: Timeout 30000ms exceeded.
2026-02-20T13:36:58.520Z =========================== logs ===========================
2026-02-20T13:36:58.521Z waiting for navigation until "load"
2026-02-20T13:36:58.521Z ============================================================
2026-02-20T13:36:58.522Z     at PlaywrightCrawler.requestHandler (/home/myuser/src/main.js:35:18)
2026-02-20T13:36:58.523Z     at async wrap (/home/myuser/node_modules/@apify/timeout/cjs/index.cjs:54:21) {"id":"xSL1PnBZ7HHX1Ae","url":"http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=RANKIN%20SHAWN%20&serial=&qry=inCustody","method":"GET","uniqueKey":"http://inmate-search.cobbsheriff.org/inquiry.asp?inmate_name=RANKIN+SHAWN+&qry=inCustody&serial=&soid="}
2026-02-20T13:36:58.745Z INFO  PlaywrightCrawler: All requests from the queue have been processed, the crawler will shut down.
2026-02-20T13:36:59.779Z INFO  PlaywrightCrawler: Final request statistics: {"requestsFinished":0,"requestsFailed":1,"retryHistogram":[null,null,null,1],"requestAvgFailedDurationMillis":37142,"requestAvgFinishedDurationMillis":null,"requestsFinishedPerMinute":0,"requestsFailedPerMinute":0,"requestTotalDurationMillis":37142,"requestsTotal":1,"crawlerRuntimeMillis":139671}
2026-02-20T13:36:59.780Z INFO  PlaywrightCrawler: Error analysis: {"totalErrors":1,"uniqueErrors":1,"mostCommonErrors":["1x: page.waitForNavigation: Timeout 30000ms exceeded. (/home/myuser/src/main.js:35:18)"]}
2026-02-20T13:36:59.781Z INFO  PlaywrightCrawler: Finished! Total 1 requests: 0 succeeded, 1 failed. {"terminal":true}
