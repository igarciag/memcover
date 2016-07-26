FROM ubuntu:14.04
MAINTAINER Juan Morales <juan.morales@upm.es>

RUN apt-get update && apt-get install -y \
    mongodb \ 
    python-pip \
    python-dev \
    libzmq3 \ 
    libzmq3-dev \ 
    r-base \
    python-pandas \
    python-scipy \
    python-matplotlib

RUN pip install gevent pymongo pyzmq Werkzeug \
    gevent-websocket circus Logbook xlrd XlsxWriter \
    seaborn

RUN rm -rf /var/lib/apt/lists/*

RUN curl -O "http://cran.r-project.org/src/contrib/Archive/rzmq/rzmq_0.6.8.tar.gz"
RUN curl -O "https://cran.r-project.org/src/contrib/Archive/rjson/rjson_0.2.14.tar.gz"
RUN curl -O "https://cran.r-project.org/src/contrib/Archive/fitdistrplus/fitdistrplus_1.0-5.tar.gz"
RUN R CMD INSTALL rzmq_0.6.8.tar.gz rjson_0.2.14.tar.gz fitdistrplus_1.0-5.tar.gz

COPY memcover/ /app/memcover/
#COPY data/ /app/data/
COPY lib/ /app/lib/
COPY memcover.ini /app/memcover.ini

EXPOSE 18000 18001 19000 19001 8888

WORKDIR /app
CMD ["circusd", "memcover.ini"]
