const PublicPropertiesMaps = {
  $el: (i) => i.vnode.el,
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance;
    if(key in setupState) {
      return setupState[key];
    }

    const publicGetter = PublicPropertiesMaps[key];
    if(publicGetter) {
      return publicGetter(instance);
    }
  }
}