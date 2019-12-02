ARG image
ARG environment

FROM ${image}:${environment}

COPY connector-app /opt/z-way-server/automation/userModules/SenergyConnector
RUN chmod -R ug+rwx /opt/z-way-server/automation/userModules/SenergyConnector
