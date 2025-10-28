## Building the image

To build the docker image described in the dockerfile run the following command
```cmd
docker build -t fin-rabbit-mq .
```
*Mkae sure you are in the FinRabbitMQ folder in your command prompt*

## Deploying Image
Use the command console not the Docker UI to deploy the image. This is easier since you can more easily map the exposed ports in the image to ports on your home PC. To make sure ports are never unknowingly taken Docker does not allow baking this into the image.

To deploy the docker image run the following command:
docker run -d -p 5672:5672 -p 15672:15672 fin-rabbit-mq