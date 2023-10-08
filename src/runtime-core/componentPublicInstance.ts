const PublicPropertiesMaps = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    
    const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

    if(hasOwn(setupState, key)) {
      return setupState[key];
    } else if(hasOwn(props, key)) {
      return props[key];
    }

    const publicGetter = PublicPropertiesMaps[key];
    if(publicGetter) {
      return publicGetter(instance);
    }
  }
}