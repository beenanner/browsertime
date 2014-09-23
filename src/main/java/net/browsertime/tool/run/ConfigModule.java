package net.browsertime.tool.run;

import net.browsertime.tool.BasicAuth;
import net.browsertime.tool.Headers;

import com.google.inject.AbstractModule;
import com.google.inject.name.Names;
import com.google.inject.util.Providers;

public class ConfigModule extends AbstractModule {
  private TimingConfig config;

  public ConfigModule(TimingConfig config) {
    this.config = config;
  }

  @Override
  protected void configure() {
    bind(Boolean.class).annotatedWith(Names.named("debugMode"))
        .toInstance(config.debugMode);
    bind(Boolean.class).annotatedWith(Names.named("prettyPrint"))
        .toInstance(config.shouldPrettyPrint);
    bind(Boolean.class).annotatedWith(Names.named("includeRuns"))
        .toInstance(config.shouldIncludeRuns);
    bind(Integer.class).annotatedWith(Names.named("timeoutSeconds"))
        .toInstance(config.timeoutSeconds);
    if (config.headers !=null) 
      bind(Headers.class).toInstance(config.headers);
    else bind(Headers.class).toProvider(Providers.<Headers>of(null));
    
    if (config.basicAuth != null) {
      bind(BasicAuth.class).toInstance(config.basicAuth);
    } else {
      bind(BasicAuth.class).toProvider(Providers.<BasicAuth>of(null));
    }
  }
}