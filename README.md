# ern-container-publisher-looper-maven

An [electrode-native publisher](https://native.electrode.io/reference/glossary#container-publishers) for Maven via [Looper](https://looper.readthedocs.io/en/latest/).

This publisher requires the following environment variables:

* `LOOPER_MAVEN_POM_ARTIFACTID`: the `artifactId` of the package
* `LOOPER_MAVEN_POM_GROUPID`: the `groupId` of the package
* `NEXUS_USERNAME`: Publication repository's username, read dynamically by
  Gradle
* `NEXUS_PASSWORD`: Publication repository's password, read dynamically by
  Gradle
