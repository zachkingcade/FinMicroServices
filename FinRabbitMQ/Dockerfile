FROM rabbitmq:3-management

# Create a 'config' directory and place your rabbitmq.conf and definitions.json there
COPY ./configs/rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
COPY ./configs/enabled_plugins /etc/rabbitmq/enabled_plugins
# I don't yet have one -> COPY ./config/definitions.json /etc/rabbitmq/definitions.json

EXPOSE 5672 15672

ENV RABBITMQ_DEFAULT_USER=admin
ENV RABBITMQ_DEFAULT_PASS=022618Admin~8097